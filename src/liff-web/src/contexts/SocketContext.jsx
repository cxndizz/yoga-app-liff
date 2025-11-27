import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const apiBase = import.meta.env.VITE_API_BASE_URL;
const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    console.log('[Socket] Connecting to WebSocket server...');

    const newSocket = io(apiBase, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);

      // Join user room if logged in
      try {
        const liffUserData = JSON.parse(localStorage.getItem('liff_user') || '{}');
        const userId = liffUserData?.user?.id;

        if (userId) {
          newSocket.emit('join', {
            userId,
            room: 'users',
          });
        }
      } catch (err) {
        console.error('[Socket] Failed to parse user data:', err);
      }
    });

    newSocket.on('joined', (data) => {
      console.log('[Socket] Joined rooms:', data.rooms);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect on unexpected disconnect
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, manually reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          newSocket.connect();
        }, 1000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('[Socket] Socket error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return newSocket;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      console.log('[Socket] Disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  /**
   * Subscribe to a WebSocket event
   * @param {string} eventName - Event name to listen for
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  const on = useCallback((eventName, callback) => {
    if (!socketRef.current) {
      console.warn(`[Socket] Cannot subscribe to "${eventName}" - socket not connected`);
      return () => {};
    }

    // Store listener for cleanup
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, new Set());
    }
    listenersRef.current.get(eventName).add(callback);

    socketRef.current.on(eventName, callback);
    console.log(`[Socket] Subscribed to event: ${eventName}`);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, callback);
      }
      if (listenersRef.current.has(eventName)) {
        listenersRef.current.get(eventName).delete(callback);
      }
      console.log(`[Socket] Unsubscribed from event: ${eventName}`);
    };
  }, []);

  /**
   * Emit an event to the server
   */
  const emit = useCallback((eventName, data) => {
    if (!socketRef.current) {
      console.warn(`[Socket] Cannot emit "${eventName}" - socket not connected`);
      return;
    }

    socketRef.current.emit(eventName, data);
    console.log(`[Socket] Emitted event: ${eventName}`, data);
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callbacks, eventName) => {
        callbacks.forEach((callback) => {
          if (socketRef.current) {
            socketRef.current.off(eventName, callback);
          }
        });
      });
      listenersRef.current.clear();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    on,
    emit,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
