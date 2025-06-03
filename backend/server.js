import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // 👈 install this
import authRoutes from './routes/authroutes.js';
import connectDB from './config/db.js';
import videoRoutes from './routes/videoRoutes.js';
import commentRoutes from './routes/commentRoute.js'
import { EventEmitter } from 'node:events';
import subscribeRoutes from './routes/subscribeRoutes.js';
import userRoute from './routes/userRoute.js';
import searchRoute from './routes/searchRoute.js'
import watchHistory from './routes/watchHistoryRoute.js'
import watchLater from './routes/watchLaterRoute.js'


EventEmitter.defaultMaxListeners = 15; // Increase to 15 (default is 10)
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // 👈 needed to read refresh token

app.use('/api/auth', authRoutes);

app.use('/api/videos', videoRoutes);

app.use('/api/comment',commentRoutes) 

app.use('/api/subscription', subscribeRoutes);

app.use('/api/users',userRoute);

app.use('/api/search',searchRoute)

app.use('/api/history',watchHistory);

app.use('/api/watchLater',watchLater);


app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
