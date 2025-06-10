import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authroutes.js';
import connectDB from './config/db.js';
// ... other route imports ...

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000; // Consistent port (5000)

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_video', (videoId) => {
    socket.join(videoId);
    console.log(`Client ${socket.id} joined video room ${videoId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Attach io instance to app for use in controllers
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
// ... other routes ...

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    websocket: io.engine.clientsCount > 0 ? 'active' : 'inactive'
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket server ready at ws://localhost:${PORT}`);
  console.log(`✅ MongoDB Connected: ${process.env.MONGO_URI.split('@')[1]?.split('.')[0] || 'connected'}`);
});