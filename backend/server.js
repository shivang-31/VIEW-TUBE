import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { EventEmitter } from 'node:events';
import connectDB from './config/db.js';

// 📦 Route Imports
import authRoutes from './routes/authroutes.js';
import videoRoutes from './routes/videoRoutes.js';
import commentRoutes from './routes/commentRoute.js';
import subscribeRoutes from './routes/subscribeRoutes.js';
import userRoute from './routes/userRoute.js';
import searchRoute from './routes/searchRoute.js';
import watchHistory from './routes/watchHistoryRoute.js';
import watchLater from './routes/watchLaterRoute.js';
import PlayListRoute from './routes/PlayListRoute.js';
import channelRoutes from './routes/ChannelRoutes.js'; // ✅ New channel system

// Set max event listeners to prevent warnings
EventEmitter.defaultMaxListeners = 15;

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express and server
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// WebSocket event handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join_video', (videoId) => {
    socket.join(videoId);
    console.log(`📺 Client ${socket.id} joined video room ${videoId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Attach socket instance to app for use in controllers
app.set('io', io);

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/playlist', PlayListRoute);
app.use('/api/subscription', subscribeRoutes);
app.use('/api/users', userRoute);
app.use('/api/search', searchRoute);
app.use('/api/history', watchHistory);
app.use('/api/watchLater', watchLater);
app.use('/api/channels', channelRoutes); // ✅ Channel routes added

// Health check endpoint for uptime monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    websocket: io.engine.clientsCount > 0 ? 'active' : 'inactive',
  });
});

// Start HTTP + WebSocket server
httpServer.listen(PORT, () => {
  console.log(`✅ Server running:       http://localhost:${PORT}`);
  console.log(`✅ WebSocket server:     ws://localhost:${PORT}`);
  console.log(`✅ MongoDB Connected:    ${process.env.MONGO_URI?.split('@')[1]?.split('.')[0] || 'connected'}`);
});
