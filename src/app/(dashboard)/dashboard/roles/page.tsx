'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus, Pencil, Trash2, Loader2, Users, Check, ChevronDown, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

type PermissionItem = {
  id: string;
  code: string;
  name: string;
  module: string;
};

type RoleItem = {
  id: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissions?: Array<{ permission?: PermissionItem; permissionId?: string }>;
  _count?: { users?: number };
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  customers: 'Khách hàng',
  orders: 'Đơn hàng',
  payments: 'Thanh toán',
  courses: 'Khóa học',
  schedules: 'Lịch học',
  reports: 'Báo cáo',
  expenses: 'Chi phí',
  users: 'Nhân sự',
  roles: 'Phân quyền',
  webhooks: 'Webhook',
  logs: 'Audit Log',
  settings: 'Cài đặt',
};

const PERMISSION_LABELS: Record<string, string> = {
  'dashboard.view': 'Xem tổng quan',
  'customers.view': 'Xem khách hàng',
  'customers.create': 'Tạo khách hàng',
  'customers.update': 'Sửa khách hàng',
  'customers.delete': 'Xóa khách hàng',
  'customers.restore': 'Khôi phục khách hàng',
  'customers.manage': 'Quản lý khách hàng',
  'orders.view': 'Xem đơn hàng',
  'orders.create': 'Tạo đơn hàng',
  'orders.update': 'Sửa đơn hàng',
  'orders.delete': 'Xóa đơn hàng',
  'orders.payment.update': 'Cập nhật thanh toán',
  'orders.invoice.update': 'Cập nhật hóa đơn',
  'orders.manage': 'Quản lý đơn hàng',
  'payments.view': 'Xem giao dịch',
  'payments.settings.view': 'Xem cài đặt thanh toán',
  'payments.webhook-logs.view': 'Xem log webhook thanh toán',
  'courses.view': 'Xem khóa học',
  'courses.create': 'Tạo khóa học',
  'courses.update': 'Sửa khóa học',
  'courses.delete': 'Xóa khóa học',
  'courses.restore': 'Khôi phục khóa học',
  'courses.manage': 'Quản lý khóa học',
  'schedules.view': 'Xem lịch học',
  'schedules.create': 'Tạo lịch học',
  'schedules.update': 'Sửa lịch học',
  'schedules.delete': 'Xóa lịch học',
  'schedules.manage': 'Quản lý lịch học',
  'reports.view': 'Xem báo cáo',
  'reports.export': 'Xuất báo cáo',
  'expenses.view': 'Xem chi phí',
  'expenses.create': 'Tạo chi phí',
  'expenses.update': 'Sửa chi phí',
  'expenses.delete': 'Xóa chi phí',
  'expenses.confirm': 'Xác nhận chi phí',
  'expenses.report.view': 'Xem báo cáo chi phí',
  'expenses.manage': 'Quản lý chi phí',
  'users.view': 'Xem nhân sự',
  'users.create': 'Tạo nhân sự',
  'users.update': 'Sửa nhân sự',
  'users.delete': 'Xóa nhân sự',
  'users.manage': 'Quản lý nhân sự',
  'roles.view': 'Xem vai trò & quyền',
  'roles.create': 'Tạo vai trò & quyền',
  'roles.update': 'Sửa vai trò & quyền',
  'roles.delete': 'Xóa vai trò & quyền',
  'roles.manage': 'Quản lý vai trò & quyền',
  'webhooks.view': 'Xem webhook',
  'webhooks.update': 'Sửa webhook',
  'webhooks.manage': 'Quản lý webhook',
  'logs.view': 'Xem lịch sử hệ thống',
  'settings.view': 'Xem cài đặt',
  'settings.update': 'Sửa cài đặt',
  'settings.manage': 'Quản lý cài đặt',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] as string[] });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([api.get('/roles'), api.get('/roles/permissions')]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const permsByModule = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    permissions.forEach((permission) => {
      if (!map[permission.module]) map[permission.module] = [];
      map[permission.module].push(permission);
    });
    return map;
  }, [permissions]);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: '', description: '', permissionIds: [] });
    setExpandedModules(new Set(Object.keys(permsByModule)));
    setDialogOpen(true);
  };

  const openEdit = (role: RoleItem) => {
    const currentIds = role.permissions?.map((item) => item.permission?.id || item.permissionId || '').filter(Boolean) || [];
    setEditingRole(role);
    setForm({ name: role.name, description: role.description || '', permissionIds: currentIds });
    setExpandedModules(new Set(Object.keys(permsByModule)));
    setDialogOpen(true);
  };

  const togglePermission = (permId: string) => {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permId)
        ? current.permissionIds.filter((id) => id !== permId)
        : [...current.permissionIds, permId],
    }));
  };

  const toggleModule = (perms: PermissionItem[]) => {
    const allSelected = perms.every((permission) => form.permissionIds.includes(permission.id));
    if (allSelected) {
      setForm((current) => ({
        ...current,
        permissionIds: current.permissionIds.filter((id) => !perms.some((permission) => permission.id === id)),
      }));
      return;
    }

    const idsToAdd = perms.map((permission) => permission.id).filter((id) => !form.permissionIds.includes(id));
    setForm((current) => ({ ...current, permissionIds: [...current.permissionIds, ...idsToAdd] }));
  };

  const toggleExpandModule = (module: string) => {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, {
          description: form.description,
          permissionIds: form.permissionIds,
        });
      } else {
        await api.post('/roles', {
          name: form.name.toUpperCase().replace(/\s+/g, '_'),
          description: form.description,
          permissionIds: form.permissionIds,
        });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
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
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
            <Shield className="h-5 w-5 text-primary" />
            Vai trò & Phân quyền
          </h1>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Quản lý cấp độ truy cập hệ thống
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs shadow-sm" onClick={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Tạo vai trò
        </Button>
      </div>

      <Card className="overflow-hidden border border-slate-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-1.5 text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">Vai trò</th>
                <th className="px-4 py-1.5 text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">Mô tả</th>
                <th className="px-4 py-1.5 text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">Quyền</th>
                <th className="px-4 py-1.5 text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">Nhân sự</th>
                <th className="px-4 py-1.5 text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">Loại</th>
                <th className="px-4 py-1.5 text-right text-[10px] font-bold uppercase tracking-tight text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {roles.map((role) => (
                <tr key={role.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-50 p-1.5 text-blue-500">
                        <Shield className="h-3 w-3" />
                      </div>
                      <span className="font-bold text-slate-700">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 text-[10px] italic text-slate-400">{role.description || '—'}</td>
                  <td className="px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">{role.permissions?.length || 0} quyền</span>
                  </td>
                  <td className="px-4 py-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      <Users className="h-2.5 w-2.5" /> {role._count?.users || 0}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    {role.isSystem ? (
                      <Badge className="h-4 border-amber-100 bg-amber-50 px-1 text-[8px] font-bold uppercase text-amber-600 hover:bg-amber-50">
                        Hệ thống
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 border-slate-100 px-1 text-[8px] font-bold uppercase text-slate-400">
                        Tùy chỉnh
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-primary" onClick={() => openEdit(role)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {!role.isSystem && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-600" onClick={() => setDeleteTarget(role)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? `Chỉnh sửa vai trò: ${editingRole.name}` : 'Tạo vai trò mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {!editingRole && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tên vai trò *</label>
                <Input
                  placeholder="VD: MARKETING → sẽ lưu MARKETING"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <p className="mt-1 text-[10px] text-slate-400">Chỉ dùng chữ cái, tự động chuyển thành CHỮ HOA</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mô tả</label>
              <Input
                placeholder="Mô tả chức năng của vai trò này..."
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Phân quyền truy cập</label>
                <span className="text-[10px] text-slate-400">
                  {form.permissionIds.length}/{permissions.length} quyền được chọn
                </span>
              </div>

              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {Object.entries(permsByModule).map(([module, perms]) => {
                  const allSelected = perms.every((permission) => form.permissionIds.includes(permission.id));
                  const someSelected = perms.some((permission) => form.permissionIds.includes(permission.id));
                  const isExpanded = expandedModules.has(module);

                  return (
                    <div key={module}>
                      <div
                        className="flex cursor-pointer items-center justify-between bg-slate-50/60 px-4 py-2.5 hover:bg-slate-50"
                        onClick={() => toggleExpandModule(module)}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleModule(perms);
                            }}
                            className={`
                              flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors
                              ${allSelected ? 'border-primary bg-primary' : someSelected ? 'border-primary/50 bg-primary/30' : 'border-slate-300'}
                            `}
                          >
                            {(allSelected || someSelected) && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <span className="text-xs font-semibold text-slate-700">{MODULE_LABELS[module] || module}</span>
                          <span className="text-[10px] text-slate-400">({perms.length})</span>
                        </div>
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                      </div>

                      {isExpanded && (
                        <div className="grid grid-cols-2 gap-1.5 bg-white px-4 py-2">
                          {perms.map((perm) => (
                            <label key={perm.id} className="group flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-slate-50">
                              <div
                                onClick={() => togglePermission(perm.id)}
                                className={`
                                  flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors
                                  ${form.permissionIds.includes(perm.id) ? 'border-primary bg-primary' : 'border-slate-300 group-hover:border-primary/50'}
                                `}
                              >
                                {form.permissionIds.includes(perm.id) && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-700">{PERMISSION_LABELS[perm.code] || perm.name || perm.code}</span>
                                <p className="text-[10px] font-mono text-slate-400">{perm.code}</p>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving || (!editingRole && !form.name.trim())} className="min-w-[120px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Xóa vai trò</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-sm text-slate-600">
            Bạn có chắc muốn xóa vai trò <span className="font-bold">{deleteTarget?.name}</span>?
            <br />
            Không thể xóa vai trò đang được gán cho nhân sự.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="min-w-[80px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
