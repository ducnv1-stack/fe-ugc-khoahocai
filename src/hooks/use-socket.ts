import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';


const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
  : typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3001';

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onEvent);

  // Cập nhật ref mỗi khi callback thay đổi
  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // Khởi tạo connection
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Lắng nghe mọi event thông qua ref
    socket.onAny((event, data) => {
      if (callbackRef.current) {
        callbackRef.current(event, data);
      }
    });

    // Cleanup khi unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Kết nối WebSocket chỉ khởi tạo 1 lần

  return socketRef.current;
};
