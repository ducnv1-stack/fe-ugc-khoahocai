import React from 'react';

export default function OrdersPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold'>Đơn hàng & Bán hàng</h1>
      <p className='mt-4 text-muted-foreground italic'>Feature: orders</p>
      <div className='mt-8 p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center'>
        <div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4'>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <h2 className='text-xl font-semibold'>Đang chờ đơn hàng đầu tiên</h2>
        <p className='text-muted-foreground mt-2 max-w-sm'>
          Hệ thống sẽ hiển thị danh sách đơn hàng và trạng thái thanh toán SePay tại đây.
        </p>
      </div>
    </div>
  );
}
