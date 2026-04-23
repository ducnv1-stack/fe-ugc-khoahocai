'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  History,
  Info,
  Key,
  Loader2,
  RefreshCw,
  Search,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type WebhookLog = {
  id: string;
  status: string;
  createdAt: string;
  payload?: any;
};

type WebhookLogsResponse = {
  items: WebhookLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'MANUAL_REVIEW', label: 'Chờ duyệt tay' },
  { value: 'OUTFLOW', label: 'Tiền ra' },
  { value: 'RECEIVED', label: 'Đã nhận' },
  { value: 'IGNORED', label: 'Bỏ qua' },
  { value: 'UNAUTHORIZED', label: 'Sai secret' },
  { value: 'ERROR', label: 'Lỗi hệ thống' },
];

const TRANSFER_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả giao dịch' },
  { value: 'in', label: 'Tiền vào' },
  { value: 'out', label: 'Tiền ra' },
];

export default function WebhooksPage() {
  const [settings, setSettings] = useState<any>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [transferTypeFilter, setTransferTypeFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const limit = 20;

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/payments/settings');
      setSettings(data);
    } catch {
      toast.error('Không thể tải cấu hình webhook');
    } finally {
      setLoading(false);
    }
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (transferTypeFilter !== 'ALL') params.set('transferType', transferTypeFilter);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [page, search, statusFilter, transferTypeFilter]);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const { data } = await api.get<WebhookLogsResponse>(`/payments/webhook-logs?${queryString}`);
      setLogs(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [queryString]);

  useSocket((event) => {
    if (event === 'webhook.log.updated') {
      fetchLogs();
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, transferTypeFilter]);

  const copyToClipboard = (text: string, type: 'url' | 'secret') => {
    navigator.clipboard.writeText(text);

    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }

    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-emerald-500">Thành công</Badge>;
      case 'RECEIVED':
        return <Badge variant="outline" className="border-blue-200 text-blue-500">Đã nhận</Badge>;
      case 'OUTFLOW':
        return <Badge variant="outline" className="border-rose-200 text-rose-500">Tiền ra</Badge>;
      case 'IGNORED':
        return <Badge variant="outline" className="border-slate-200 text-slate-400">Bỏ qua</Badge>;
      case 'MANUAL_REVIEW':
        return <Badge variant="outline" className="border-amber-200 text-amber-600">Chờ duyệt tay</Badge>;
      case 'UNAUTHORIZED':
        return <Badge variant="destructive">Sai Secret</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Lỗi hệ thống</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransferMeta = (payload: any) => {
    if (payload?.transferType === 'out') {
      return {
        label: 'Tiền ra',
        prefix: '-',
        amountClassName: 'text-rose-600',
        rowClassName: 'bg-rose-50/30',
      };
    }

    return {
      label: 'Tiền vào',
      prefix: '+',
      amountClassName: 'text-emerald-600',
      rowClassName: '',
    };
  };

  const formatLogTime = (log: WebhookLog) => {
    const payload = log.payload || {};
    const sourceTime = payload.transactionDate ? payload.transactionDate.replace(' ', 'T') : log.createdAt;
    return new Date(sourceTime).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const showLogDetails = (log: WebhookLog) => {
    setSelectedLog(log);
    setIsLogModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-4 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
            <Webhook className="h-5 w-5 text-primary" />
            Cấu hình Webhooks
          </h2>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Tích hợp thanh toán tự động với SePay
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={fetchLogs} disabled={logsLoading}>
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', logsLoading && 'animate-spin')} />
          Làm mới log
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-none shadow-sm shadow-slate-200/50">
            <CardHeader className="border-b bg-slate-50/50 p-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                    <Webhook className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-tight">Thông tin tích hợp</CardTitle>
                    <p className="text-[9px] font-medium tracking-tight text-slate-400">
                      Cấu hình Webhook URL trên hệ thống SePay
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-100 bg-emerald-50 px-1.5 py-0 text-[8px] font-bold uppercase text-emerald-700">
                  <RefreshCw className="mr-1 h-2.5 w-2.5" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  Webhook URL
                  <Badge variant="secondary" className="h-3.5 px-1 text-[8px] font-bold">POST</Badge>
                </label>
                <div className="flex gap-2">
                  <Input readOnly value={settings?.url} className="h-8 bg-slate-50 font-mono text-xs" />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(settings?.url, 'url')}>
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-[10px] leading-tight text-slate-400">
                  <Info className="mr-1 inline h-2.5 w-2.5" />
                  Endpoint nhận tín hiệu thanh toán từ SePay
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  Webhook Secret (API Key)
                  <Key className="h-2.5 w-2.5 text-slate-400" />
                </label>
                <div className="flex gap-2">
                  <Input type="password" readOnly value={settings?.secret} className="h-8 bg-slate-50 font-mono text-xs" />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(settings?.secret, 'secret')}>
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm shadow-slate-200/50">
            <CardHeader className="border-b bg-slate-50/50 p-3 px-4">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
                <History className="h-4 w-4 text-blue-500" />
                Logs giao dịch thời gian thực
              </CardTitle>
            </CardHeader>

            <div className="border-b bg-white p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Tìm nội dung, mô tả, mã giao dịch..."
                    className="h-9 pl-9 text-sm"
                  />
                </div>

                <Select value={transferTypeFilter} onValueChange={(value) => setTransferTypeFilter(value || 'ALL')}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Loại giao dịch">
                      {TRANSFER_TYPE_OPTIONS.find((option) => option.value === transferTypeFilter)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'ALL')}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Trạng thái">
                      {STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[180px]">Thời gian</TableHead>
                  <TableHead>Nội dung GD</TableHead>
                  <TableHead className="w-[120px]">Số tiền</TableHead>
                  <TableHead className="w-[120px]">Trạng thái</TableHead>
                  <TableHead className="w-[80px] text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center italic text-slate-400">
                      {logsLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Không có bản ghi nào khớp bộ lọc.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const payload = log.payload || {};
                    const transferMeta = getTransferMeta(payload);
                    return (
                      <TableRow key={log.id} className={cn('group hover:bg-slate-50/50', transferMeta.rowClassName)}>
                        <TableCell className="py-1.5 text-[10px] font-medium text-slate-400">
                          <div className="space-y-0.5">
                            <div>{formatLogTime(log)}</div>
                            <div className="text-[9px] uppercase tracking-wide">{transferMeta.label}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <code className="block max-w-[220px] truncate rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600">
                            {payload.content || payload.description || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className={cn('py-1.5 text-xs font-bold', transferMeta.amountClassName)}>
                          {transferMeta.prefix}
                          {new Intl.NumberFormat('vi-VN').format(payload.transferAmount || 0)}đ
                        </TableCell>
                        <TableCell className="py-1.5">
                          <div className="-ml-3 origin-left scale-75">{getStatusBadge(log.status)}</div>
                        </TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-primary" onClick={() => showLogDetails(log)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <p className="text-[12px] text-slate-500">
                Tổng <span className="font-bold text-slate-800">{total}</span> log
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1 || logsLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trang trước
                </Button>
                <div className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  Trang {page}/{totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages || logsLoading}
                >
                  Trang sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-none bg-slate-900 text-white shadow-sm shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="h-4 w-4" />
                Liên kết nhanh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <a
                href="https://my.sepay.vn/webhooks"
                target="_blank"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Quản lý Webhooks SePay
              </a>
              <a
                href="https://my.sepay.vn/transactions"
                target="_blank"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white')}
              >
                <History className="mr-2 h-4 w-4" />
                Lịch sử giao dịch SePay
              </a>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm shadow-slate-200/50">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Trình trạng ngân hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold">{settings?.bankInfo?.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono">{settings?.bankInfo?.accountNo}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-primary">{settings?.bankInfo?.accountName}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[12px] font-medium">Sẵn sàng nhận tín hiệu định danh</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-[12px] leading-relaxed text-amber-800">
              <strong>Lưu ý:</strong> SePay có thể gửi lại webhook nếu server của bạn không phản hồi HTTP 200. Hãy kiểm tra log để xem các yêu cầu trùng lặp hoặc lỗi nếu có.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-blue-600" />
              Chi tiết Raw Payload (JSON)
            </DialogTitle>
            <DialogDescription>Xem nội dung gốc được SePay gửi đến endpoint webhook của bạn.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-slate-950 p-6">
            <pre className="text-[11px] leading-relaxed text-blue-200">
              {selectedLog ? JSON.stringify(selectedLog.payload, null, 2) : ''}
            </pre>
          </div>

          <div className="flex items-center justify-between border-t bg-slate-50 p-4">
            <div className="text-[11px] text-slate-500">
              Mã giao dịch:{' '}
              <span className="font-mono">
                {selectedLog?.payload?.referenceCode || selectedLog?.payload?.code || 'N/A'}
              </span>
            </div>
            <Button size="sm" onClick={() => setIsLogModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
