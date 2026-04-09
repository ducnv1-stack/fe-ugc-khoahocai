import React from 'react';

export default function SystemPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold'>Hệ thống & Cấu hình</h1>
      <p className='mt-4 text-muted-foreground italic'>Feature: system_settings</p>
      <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
        {['Quản lý Nhân sự', 'Cấu hình Webhook', 'Audit Logs'].map(title => (
          <div key={title} className='p-6 border rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-900'>
            <h3 className='font-semibold'>{title}</h3>
            <p className='text-sm text-muted-foreground mt-2'>Thiết lập các tham số hệ thống cho module {title}.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
