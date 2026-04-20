import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { IMessage } from '../types/chat';

export const useSocket = (applicationId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io('/chat', {
      query: { token: accessToken },
      transports: ['websocket'],
    });

    if (applicationId) {
      socketRef.current.emit('joinRoom', { applicationId });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [accessToken, applicationId]);

  const sendMessage = useCallback(
    (data: { applicationId: string; text?: string; filePath?: string; fileName?: string }) => {
      socketRef.current?.emit('sendMessage', data);
    },
    [],
  );

  const onNewMessage = useCallback(
    (callback: (message: IMessage) => void) => {
      socketRef.current?.on('newMessage', callback);
      return () => {
        socketRef.current?.off('newMessage', callback);
      };
    },
    [],
  );

  const markAsRead = useCallback(
    (appId: string) => {
      socketRef.current?.emit('messagesRead', { applicationId: appId });
    },
    [],
  );

  return { sendMessage, onNewMessage, markAsRead, socket: socketRef.current };
};
