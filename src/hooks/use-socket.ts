import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';


const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
  const socketRef = useRef<Socket | null>(null);

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

    // Lắng nghe mọi event nếu có callback
    if (onEvent) {
      socket.onAny((event, data) => {
        onEvent(event, data);
      });
    }

    // Cleanup khi unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Chỉ chạy 1 lần khi mount

  return socketRef.current;
};
