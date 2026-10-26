import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    const s = io('http://localhost:5000');
    s.on('connect', () => {
      s.emit('join', user.id);
    });
    setSocket(s);

    return () => s.disconnect();
  }, [user]);

  // Join event room for realtime agenda
  const joinEvent = (eventId) => {
    if (socket) socket.emit('join_event', eventId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinEvent }}>
      {children}
    </SocketContext.Provider>
  );
}
