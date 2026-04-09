'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Users, Check, ChevronDown, ChevronRight
} from 'lucide-react';
import api from '@/lib/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] as string[] });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions'),
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group permissions by module
  const permsByModule = useMemo(() => {
    const map: Record<string, any[]> = {};
    permissions.forEach(p => {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    });
    return map;
  }, [permissions]);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: '', description: '', permissionIds: [] });
    setExpandedModules(new Set(Object.keys(permsByModule)));
    setDialogOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    const currentIds = role.permissions?.map((rp: any) => rp.permission?.id || rp.permissionId) || [];
    setForm({ name: role.name, description: role.description || '', permissionIds: currentIds });
    setExpandedModules(new Set(Object.keys(permsByModule)));
    setDialogOpen(true);
  };

  const togglePermission = (permId: string) => {
    setForm(f => ({
      ...f,
      permissionIds: f.permissionIds.includes(permId)
        ? f.permissionIds.filter(id => id !== permId)
        : [...f.permissionIds, permId],
    }));
  };

  const toggleModule = (module: string, perms: any[]) => {
    const allSelected = perms.every(p => form.permissionIds.includes(p.id));
    if (allSelected) {
      setForm(f => ({ ...f, permissionIds: f.permissionIds.filter(id => !perms.find(p => p.id === id)) }));
    } else {
      const toAdd = perms.map(p => p.id).filter(id => !form.permissionIds.includes(id));
      setForm(f => ({ ...f, permissionIds: [...f.permissionIds, ...toAdd] }));
    }
  };

  const toggleExpandModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module); else next.add(module);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, { description: form.description, permissionIds: form.permissionIds });
      } else {
        await api.post('/roles', { name: form.name.toUpperCase().replace(/\s+/g, '_'), description: form.description, permissionIds: form.permissionIds });
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
      await api.delete(`/roles/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const MODULE_LABELS: Record<string, string> = {
    dashboard: '🏠 Tổng quan',
    customers: '👥 Khách hàng',
    orders: '📦 Đơn hàng',
    payments: '💳 Thanh toán',
    courses: '📚 Khóa học',
    schedules: '📅 Lịch học',
    reports: '📊 Báo cáo',
    users: '👤 Nhân sự',
    roles: '🛡️ Phân quyền',
    webhooks: '🔗 Webhook',
    logs: '🔍 Audit Log',
    settings: '⚙️ Cài đặt',
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-primary" />
            Vai trò & Phân quyền
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Quản lý các chức danh và giới hạn quyền truy cập của hệ thống.</p>
        </div>
        <Button className="shadow-sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Tạo vai trò
        </Button>
      </div>

      {/* Roles Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Vai trò</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Mô tả</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Quyền</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Nhân sự</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Loại</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800">{role.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{role.description || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-600 font-medium">
                      {role.permissions?.length || 0} quyền
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-full px-2.5 py-0.5 text-slate-600 font-medium">
                      <Users className="w-3 h-3" /> {role._count?.users || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {role.isSystem ? (
                      <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Hệ thống</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-600">Tùy chỉnh</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => openEdit(role)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {!role.isSystem && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => setDeleteTarget(role)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? `Chỉnh sửa vai trò: ${editingRole.name}` : 'Tạo vai trò mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Name - Only for create */}
            {!editingRole && (
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tên vai trò *</label>
                <Input
                  placeholder="VD: MARKETING → sẽ lưu MARKETING"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                <p className="text-[10px] text-slate-400 mt-1">Chỉ dùng chữ cái, tự động chuyển thành CHỮ HOA</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Mô tả</label>
              <Input
                placeholder="Mô tả chức năng của vai trò này..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Permissions grouped by module */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-600">Phân quyền truy cập</label>
                <span className="text-[10px] text-slate-400">{form.permissionIds.length}/{permissions.length} quyền được chọn</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {Object.entries(permsByModule).map(([module, perms]) => {
                  const allSelected = perms.every(p => form.permissionIds.includes(p.id));
                  const someSelected = perms.some(p => form.permissionIds.includes(p.id));
                  const isExpanded = expandedModules.has(module);

                  return (
                    <div key={module}>
                      {/* Module header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 hover:bg-slate-50 cursor-pointer"
                        onClick={() => toggleExpandModule(module)}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); toggleModule(module, perms); }}
                            className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                              allSelected ? 'bg-primary border-primary' :
                              someSelected ? 'bg-primary/30 border-primary/50' :
                              'border-slate-300'
                            }`}
                          >
                            {(allSelected || someSelected) && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className="text-xs font-semibold text-slate-700">
                            {MODULE_LABELS[module] || module}
                          </span>
                          <span className="text-[10px] text-slate-400">({perms.length})</span>
                        </div>
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        }
                      </div>

                      {/* Individual permissions */}
                      {isExpanded && (
                        <div className="px-4 py-2 grid grid-cols-2 gap-1.5 bg-white">
                          {perms.map(perm => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group"
                            >
                              <div
                                onClick={() => togglePermission(perm.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                                  form.permissionIds.includes(perm.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-slate-300 group-hover:border-primary/50'
                                }`}
                              >
                                {form.permissionIds.includes(perm.id) && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-700">{perm.name}</span>
                                <p className="text-[10px] text-slate-400 font-mono">{perm.code}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="min-w-[120px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Xóa vai trò</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Bạn có chắc muốn xóa vai trò <span className="font-bold">{deleteTarget?.name}</span>?<br />
            Không thể xóa vai trò đang được gán cho nhân sự.
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
