'use client';

import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  Info, 
  Key, 
  History, 
  Zap, 
  RefreshCw,
  Loader2,
  Eye,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';

export default function WebhooksPage() {
  const [settings, setSettings] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/payments/settings');
      setSettings(data);
    } catch (error) {
      toast.error('Không thể tải cấu hình webhook');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const { data } = await api.get('/payments/webhook-logs');
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Listen for realtime log updates
  useSocket((event) => {
    if (event === 'webhook.log.updated') {
      fetchLogs();
    }
  });

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

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
      case 'SUCCESS': return <Badge className="bg-emerald-500">Thành công</Badge>;
      case 'RECEIVED': return <Badge variant="outline" className="text-blue-500 border-blue-200">Đã nhận</Badge>;
      case 'IGNORED': return <Badge variant="outline" className="text-slate-400 border-slate-200">Bỏ qua</Badge>;
      case 'UNAUTHORIZED': return <Badge variant="destructive">Sai Secret</Badge>;
      case 'ERROR': return <Badge variant="destructive">Lỗi hệ thống</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const showLogDetails = (log: any) => {
    setSelectedLog(log);
    setIsLogModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cấu hình Webhooks</h2>
          <p className="text-muted-foreground mt-1">
            Tích hợp thanh toán tự động với SePay qua cổng Webhook.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} /> Làm mới Log
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm shadow-slate-200/50">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Webhook className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Thông tin tích hợp</CardTitle>
                    <CardDescription>Sử dụng các thông tin này để cấu hình trên SePay.</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <RefreshCw className="w-3 h-3 mr-1" /> Đang hoạt động
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  Webhook URL
                  <Badge variant="secondary" className="text-[10px] h-4">POST</Badge>
                </label>
                <div className="flex gap-2">
                  <Input readOnly value={settings?.url} className="bg-slate-50 font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(settings?.url, 'url')}>
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[12px] text-slate-400">
                  <Info className="w-3 h-3 inline mr-1" /> 
                  Đây là endpoint mà SePay sẽ gọi đến khi có giao dịch thành công.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  Webhook Secret (API Key)
                  <Key className="w-3 h-3" />
                </label>
                <div className="flex gap-2">
                  <Input type="password" readOnly value={settings?.secret} className="bg-slate-50 font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(settings?.secret, 'secret')}>
                    {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[12px] text-slate-400">
                   Sử dụng Secret này trong mục <strong>Xác thực (Auth)</strong> trên SePay để đảm bảo an toàn.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Logs History */}
          <Card className="border-none shadow-sm shadow-slate-200/50 overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
               <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" /> Lịch sử Webhook (Giao dịch nhận được)
               </CardTitle>
            </CardHeader>
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
                    <TableCell colSpan={5} className="h-24 text-center text-slate-400 italic">
                      {logsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Chưa có dữ liệu webhook nào."}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const payload = log.payload || {};
                    return (
                      <TableRow key={log.id} className="group hover:bg-slate-50/50">
                        <TableCell className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded w-fit border border-slate-200">
                              {payload.content || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-emerald-600">
                          +{new Intl.NumberFormat('vi-VN').format(payload.transferAmount || 0)}đ
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => showLogDetails(log)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-sm shadow-slate-200/50 bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Liên kết nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-6">
                 <a 
                   href="https://my.sepay.vn/webhooks" 
                   target="_blank" 
                   className={cn(buttonVariants({ variant: 'outline' }), "w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white")}
                 >
                    <ExternalLink className="w-4 h-4 mr-2" /> Quản lý Webhooks SePay
                 </a>
                 <a 
                   href="https://my.sepay.vn/transactions" 
                   target="_blank" 
                   className={cn(buttonVariants({ variant: 'outline' }), "w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white")}
                 >
                    <History className="w-4 h-4 mr-2" /> Lịch sử giao dịch SePay
                 </a>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm shadow-slate-200/50 overflow-hidden">
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" /> Trình trạng ngân hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold">{settings?.bankInfo?.id}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="font-mono">{settings?.bankInfo?.accountNo}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-primary">{settings?.bankInfo?.accountName}</span>
                 </div>
                 <Separator />
                 <div className="flex items-center gap-2 text-emerald-600">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[12px] font-medium">Sẵn sàng nhận tín hiệu định danh</span>
                 </div>
              </CardContent>
           </Card>

           <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                <strong>Lưu ý:</strong> SePay có thể gửi lại webhook nếu server của bạn không phản hồi HTTP 200. Hãy kiểm tra Log để xem các yêu cầu trùng lặp hoặc lỗi nếu có.
              </p>
           </div>
        </div>
      </div>

      {/* Raw Payload Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-600" /> Chi tiết Raw Payload (JSON)
            </DialogTitle>
            <DialogDescription>
              Xem nội dung gốc được SePay gửi đến endpoint webhook của bạn.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 overflow-auto bg-slate-950 flex-1">
            <pre className="text-[11px] font-mono leading-relaxed text-blue-200">
              {selectedLog ? JSON.stringify(selectedLog.payload, null, 2) : ''}
            </pre>
          </div>
          
          <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
             <div className="text-[11px] text-slate-500">
                ID Giao dịch: <span className="font-mono">{selectedLog?.payload?.code || 'N/A'}</span>
             </div>
             <Button size="sm" onClick={() => setIsLogModalOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
