import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Routers
import userRouter from './src/app/api/users/route.js';
import familyMemberRouter from './src/app/api/familyMember/route.js';
import serviceRouter from './src/app/api/services/route.js';
import appointmentRouter from './src/app/api/appointments/route.js';
import chatMessageRouter from './src/app/api/chatMessage/route.js';
import reviewRouter from './src/app/api/reviews/route.js';
import productRouter from './src/app/api/product/route.js';
import orderRouter from './src/app/api/order/route.js';
import orderItemRouter from './src/app/api/orderItem/route.js';
import workShiftRouter from './src/app/api/workShifts/route.js';
import notificationRouter from './src/app/api/notifications/route.js';
import authRouter from './src/app/api/auth/route.js';
import salonRouter from './src/app/api/salon/route.js';
import chatRouter from './src/app/api/chat/route.js';
import uploadRouter from './src/app/api/upload/route.js';

import { sendUpcomingAppointmentReminders } from './src/lib/notificationService.js';

// ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'], // frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'tajna_jwt_kljuc';

// ✅ Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Previše zahtjeva. Pokušaj kasnije.',
});
app.use(apiLimiter);

// ✅ CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ✅ Middlewares
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Auth middleware (for REST)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ✅ REST API routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/familyMembers', familyMemberRouter);
app.use('/api/services', serviceRouter);
app.use('/api/appointments', appointmentRouter);
// PRAVILNO — jasno razdvojene rute
app.use('/api/chat/messages', authMiddleware, chatMessageRouter);      // Za CRUD
app.use('/api/chat/conversations', chatRouter);                        // Za real-time API i socket povezane stvari
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/orderItems', orderItemRouter);
app.use('/api/workShifts', workShiftRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/salon', salonRouter);
app.use('/api/upload', uploadRouter);

// ✅ Socket.IO autentikacija
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token nije poslan'));

  try {
    const payload = jwt.verify(token, SECRET);
    if (!payload || typeof payload !== 'object' || !payload.id) {
      return next(new Error('Neispravan token'));
    }
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Neautorizovan pristup Socket.IO'));
  }
});

// ✅ Socket.IO chat logika
io.on('connection', (socket) => {
  console.log('✅ Socket konekcija:', socket.user?.id || socket.id);

  socket.on('joinAppointment', (appointmentId) => {
    socket.join(appointmentId);
    console.log(`🟢 Pridružen sobi: ${appointmentId}`);
  });

  socket.on('chatMessage', async (data) => {
    const { appointmentId, message, imageUrl } = data;
    if (!appointmentId || !message) {
      return console.error('❌ Nedostaje appointmentId ili poruka.');
    }

    try {
      const newMessage = await prisma.chatMessage.create({
        data: {
          appointmentId,
          senderId: socket.user.id,
          message,
          imageUrl,
        },
      });

      io.to(appointmentId).emit('newChatMessage', newMessage);
    } catch (err) {
      console.error('❌ Greška pri snimanju poruke:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Odspojen:', socket.user?.id || socket.id);
  });
});

// Postavi io u app da bude dostupan u drugim fajlovima
app.set('io', io);

// ✅ Cron za podsjetnike
setInterval(() => {
  sendUpcomingAppointmentReminders().catch(console.error);
}, 10 * 60 * 1000); // svakih 10 minuta

cron.schedule('*/1 * * * *', async () => {
  console.log('🔔 Cron job pokrenut');
  await sendUpcomingAppointmentReminders();
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server pokrenut na portu ${PORT}`));
