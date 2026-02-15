import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';

interface MetricsUpdate {
  timestamp: string;
  campaignId: number;
  metrics: {
    clicksToday: number;
    visitsToday: number;
    costToday: number;
    conversionsToday: number;
  };
}

/**
 * Subscribe to real-time campaign updates via Socket.IO.
 * Calls `onUpdate` whenever the server pushes new metrics.
 */
export function useSocket(campaignId: number, onUpdate: (data: MetricsUpdate) => void) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const socket = connectSocket();

    socket.emit('subscribe:campaign', campaignId);

    const handler = (data: MetricsUpdate) => {
      callbackRef.current(data);
    };
    socket.on('metrics:update', handler);

    return () => {
      socket.off('metrics:update', handler);
      socket.emit('unsubscribe:campaign', campaignId);
    };
  }, [campaignId]);

  // Disconnect socket when the entire app unmounts
  useEffect(() => {
    return () => disconnectSocket();
  }, []);
}
