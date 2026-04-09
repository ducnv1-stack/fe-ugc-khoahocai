import React from 'react';

export default function CustomersPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold'>Quản lý Khách hàng (CRM)</h1>
      <p className='mt-4 text-muted-foreground italic'>Feature: customers</p>
      <div className='mt-8 p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center'>
        <div className='w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4'>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h2 className='text-xl font-semibold'>Chưa có dữ liệu khách hàng</h2>
        <p className='text-muted-foreground mt-2 max-w-sm'>
          Module CRM đang được xây dựng. Bạn có thể bắt đầu tạo Lead mới sau khi API hoàn thiện.
        </p>
      </div>
    </div>
  );
}
