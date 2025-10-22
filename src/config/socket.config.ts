import { registerAs } from '@nestjs/config';

export default registerAs('socket', () => ({
  port: parseInt(process.env.SOCKET_PORT!, 10) || 3002,
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
}));