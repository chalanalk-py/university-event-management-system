import { Server } from 'socket.io';

let io;

// Initialize Socket.IO instance with CORS
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Join user-specific room for notifications
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Join event room for realtime agenda updates
    socket.on('join_event', (eventId) => {
      socket.join(`event_${eventId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
