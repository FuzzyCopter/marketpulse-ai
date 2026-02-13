import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import semRoutes from './routes/sem.routes.js';
import seoRoutes from './routes/seo.routes.js';
import { getDataSourceMode } from './datasources/index.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dataSource: getDataSourceMode(),
    version: '1.0.0',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/sem', semRoutes);
app.use('/api/seo', seoRoutes);

// Error handler
app.use(errorHandler);

// WebSocket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe:campaign', (campaignId: number) => {
    socket.join(`campaign:${campaignId}`);
    console.log(`Client ${socket.id} subscribed to campaign ${campaignId}`);
  });

  socket.on('unsubscribe:campaign', (campaignId: number) => {
    socket.leave(`campaign:${campaignId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Mock real-time updates (emit every 30 seconds)
setInterval(() => {
  const mockUpdate = {
    timestamp: new Date().toISOString(),
    campaignId: 1,
    metrics: {
      clicksToday: Math.round(1800 + Math.random() * 400),
      visitsToday: Math.round(3000 + Math.random() * 600),
      costToday: Math.round(2_500_000 + Math.random() * 500_000),
      conversionsToday: Math.round(45 + Math.random() * 20),
    },
  };
  io.to('campaign:1').emit('metrics:update', mockUpdate);
}, 30000);

// Start server
httpServer.listen(env.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║         MarketPulse AI - API Server              ║
  ║                                                  ║
  ║  Port:        ${env.port}                             ║
  ║  Environment: ${env.nodeEnv.padEnd(20)}         ║
  ║  Data Source: ${env.dataSourceMode.padEnd(20)}         ║
  ║  Frontend:    ${env.frontendUrl.padEnd(20)} ║
  ║                                                  ║
  ║  API:         http://localhost:${env.port}/api        ║
  ║  Health:      http://localhost:${env.port}/api/health  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

export { app, io, httpServer };
