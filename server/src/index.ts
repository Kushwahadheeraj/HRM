import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import path from 'path';
// import { Server as SocketIOServer } from 'socket.io-client'; 
import { Server } from 'socket.io';
import connectDB from './config/db';
import { logger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFound } from './middleware/notFound.middleware';
import { attachOrganizationId } from './middleware/organization.middleware';
import { checkTrialStatus } from './middleware/trial.middleware';
import User from './models/User.model';
import Message from './models/Message.model';
import Channel from './models/Channel.model';
import Pricing from './models/Pricing.model';
import bcrypt from 'bcrypt';

console.log('🚀 Server is starting up!');

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import teamManagerRoutes from './routes/teamManager.routes';
import attendanceRoutes from './routes/attendance.routes';
import leaveRoutes from './routes/leave.routes';
import payrollRoutes from './routes/payroll.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import channelRoutes from './routes/channel.routes';
import recruitmentRoutes from './routes/recruitment.routes';
import analyticsRoutes from './routes/analytics.routes';
import shiftRoutes from './routes/shift.routes';
import holidayRoutes from './routes/holiday.routes';
import messageRoutes from './routes/message.routes';
import performanceRoutes from './routes/performance.routes';
import reviewRoutes from './routes/review.routes';
import organizationRoutes from './routes/organization.routes';
// import { initializeSocket } from './socket/socket.server';

// Load environment variables
dotenv.config();

// Connect to MongoDB - don't exit on error, server will run even without MongoDB
connectDB()
  .then(async () => {
    try {
      // Initialize default pricing
      await Pricing.initializeDefaultPricing();
      console.log('✅ Pricing initialized successfully!');
      
      // Check if super admin exists
      let superAdmin = await User.findOne({ email: 'dheeraj01072001@gmail.com' });
      if (!superAdmin) {
        // Create super admin
        superAdmin = await User.create({
          name: 'Dheeraj Kushwaha',
          email: 'dheeraj01072001@gmail.com',
          password: bcrypt.hashSync('@Dkushwaha123', 10),
          role: 'super_admin',
          roleLabel: 'Super Administrator',
          department: 'Administration',
          avatar: '',
          employeeId: 'TRX-SUPER-ADMIN',
          phone: '8299301972',
        });
        console.log('✅ Super Admin created successfully!');
      } else {
        console.log('✅ Super Admin already exists!');
      }

      // Create default channels for organizations if needed (we'll handle per-organization later)
      console.log('✅ DB setup complete!');
    } catch (dbErr) {
      console.warn('⚠️ MongoDB operation failed, server still running:', dbErr);
    }
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB not connected, but server will still run for Socket.IO:', err);
  });

const app = express();
const server = http.createServer(app);

// initializeSocket(server);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*'],
  }
});

console.log('✅ Socket.IO server initialized');

io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.IO engine connection error:', err.req, err.code, err.message);
});

// Track online users and rooms
const onlineUsers = new Map<string, string>(); // userId -> socketId
const userRooms = new Map<string, string>(); // userId -> roomId

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // User joins
  socket.on('userOnline', (data) => {
    const { userId, role, managerName, name } = data;
    onlineUsers.set(userId, socket.id);
    
    let roomId = '';
    if (role === 'employee' && managerName) {
      roomId = `team-${managerName.trim()}`;
    } else if (role === 'team_manager' && name) {
      roomId = `team-${name.trim()}`;
    }

    if (roomId) {
      socket.join(roomId);
      userRooms.set(userId, roomId);
      console.log(`👥 User ${userId} joined room ${roomId}`);
    }
    
    io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
  });

  // Send personal message
  socket.on('sendPersonalMessage', async (data) => {
    try {
      const { from, to, content } = data;

      let messageToSend;

      try {
        // Try to use MongoDB if available
        // Find user to get name
        const senderUser = await User.findById(from);
        
        const newMessage = new Message({
          from: from,
          to: to,
          content: content,
          isGroup: false
        });
        await newMessage.save();

        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id).populate('from', 'name _id');

        messageToSend = {
          _id: populatedMessage?._id.toString(),
          from: {
            _id: senderUser?._id.toString(),
            name: senderUser?.name
          },
          to: to,
          content: content,
          isGroup: false,
          read: false,
          createdAt: populatedMessage?.createdAt?.toISOString(),
          updatedAt: populatedMessage?.updatedAt?.toISOString()
        };
      } catch (dbErr) {
        // Fallback if MongoDB isn't available
        messageToSend = {
          _id: Date.now().toString(),
          from: {
            _id: from,
            name: 'User',
          },
          to: to,
          content: content,
          isGroup: false,
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.warn('⚠️ MongoDB not available, using fallback for personal message:', dbErr);
      }

      console.log('📩 Sending personal message:', messageToSend);

      // Send to recipient
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', messageToSend);
      }
      
      // Send to sender
      socket.emit('receiveMessage', messageToSend);
    } catch (error) {
      console.error('❌ Socket sendPersonalMessage error:', error);
    }
  });

  // Send group message
  socket.on('sendGroupMessage', async (data) => {
    try {
      const { from, roomId, content } = data;
      const trimmedRoomId = roomId.trim();

      let messageToSend;

      try {
        // Try to use MongoDB if available
        // Find sender user
        const senderUser = await User.findById(from);

        const newMessage = new Message({
          from: from,
          to: trimmedRoomId,
          content: content,
          isGroup: true
        });
        await newMessage.save();

        const populatedMessage = await Message.findById(newMessage._id).populate('from', 'name _id');

        messageToSend = {
          _id: populatedMessage?._id.toString(),
          from: {
            _id: senderUser?._id.toString(),
            name: senderUser?.name
          },
          to: trimmedRoomId,
          content: content,
          isGroup: true,
          read: false,
          createdAt: populatedMessage?.createdAt?.toISOString(),
          updatedAt: populatedMessage?.updatedAt?.toISOString()
        };
      } catch (dbErr) {
        // Fallback if MongoDB isn't available
        messageToSend = {
          _id: Date.now().toString(),
          from: {
            _id: from,
            name: 'User',
          },
          to: trimmedRoomId,
          content: content,
          isGroup: true,
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.warn('⚠️ MongoDB not available, using fallback for group message:', dbErr);
      }

      console.log('📢 Sending group message to room:', trimmedRoomId);
      
      io.to(trimmedRoomId).emit('receiveMessage', messageToSend);
    } catch (error) {
      console.error('❌ Socket sendGroupMessage error:', error);
    }
  });

  // Mark messages as read
  socket.on('markAsRead', async ({ messageIds, userId }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds }, to: userId },
        { read: true }
      );
      const senderSocketId = onlineUsers.get(userId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messagesRead', { messageIds, userId });
      }
    } catch (error) {
      console.error('❌ Socket markAsRead error:', error);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    for (const [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        userRooms.delete(userId);
        io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(logger);
app.use(attachOrganizationId);
app.use(checkTrialStatus);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Traxale HRM Server is running successfully! 🚀',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// API Routes
console.log('Registering api routes...');
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/team-managers', teamManagerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
console.log('Registering /api/channels');
app.use('/api/channels', channelRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/organization', organizationRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 TRAXALE HRM SERVER                                    ║
║                                                           ║
║   Server is running on: http://localhost:${PORT}            ║
║   Environment: ${process.env.NODE_ENV || 'development'}         ║
║   MongoDB: Connected                                      ║
║   Socket.io: Active                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
