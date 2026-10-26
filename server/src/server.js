// Load environment variables from env file
import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { initSocket } from './realtime/socket.js';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

// Initialize Socket.IO for realtime features
initSocket(httpServer);

// Start http server listening for incoming connections
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
