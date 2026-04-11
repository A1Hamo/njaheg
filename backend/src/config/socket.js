// src/config/socket.js
const jwt    = require('jsonwebtoken');
const { pool } = require('./postgres');
const { Message, PrivateMessage } = require('./mongo');
const logger = require('../utils/logger');

let ioInstance;

function setupSocketIO(io) {
  ioInstance = io;

  // JWT auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await pool.query(
        'SELECT id,name,avatar_url,grade FROM users WHERE id=$1 AND is_active=true',
        [decoded.id]
      );
      if (!rows[0]) return next(new Error('User not found'));
      socket.user = rows[0];
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', socket => {
    logger.info(`Socket: ${socket.user.name} connected`);

    // Join user's private room for notifications
    socket.join(`user:${socket.user.id}`);

    socket.on('join_room', ({ subject }) => {
      const room = `room:${subject.toLowerCase()}`;
      socket.join(room);
      socket.currentRoom = room;
      socket.to(room).emit('user_joined', {
        userId: socket.user.id, name: socket.user.name,
        avatarUrl: socket.user.avatar_url, timestamp: new Date(),
      });
    });

    socket.on('leave_room', ({ subject }) => {
      socket.leave(`room:${subject.toLowerCase()}`);
    });

    socket.on('send_message', async ({ subject, content, type = 'text', fileUrl, replyTo }) => {
      if (!content?.trim() && type === 'text') return;
      const roomId = `room:${subject.toLowerCase()}`;
      try {
        const msg = await Message.create({
          roomId, subject,
          userId: socket.user.id, userName: socket.user.name,
          avatarUrl: socket.user.avatar_url, content, type, fileUrl, replyTo,
        });
        io.to(roomId).emit('new_message', {
          id: msg._id, roomId, userId: socket.user.id,
          userName: socket.user.name, avatarUrl: socket.user.avatar_url,
          content, type, fileUrl, replyTo, createdAt: msg.createdAt,
        });
        // +5 XP for chat participation
        await pool.query('UPDATE users SET xp_points=xp_points+5 WHERE id=$1', [socket.user.id]);
      } catch (err) {
        socket.emit('error', { message: 'Message failed' });
        logger.error('send_message:', err);
      }
    });

    // ── Private Messaging ──
    socket.on('send_private_message', async ({ receiverId, content, type = 'text', fileUrl }) => {
      if (!content?.trim() && type === 'text') return;
      try {
        const msg = await PrivateMessage.create({
          senderId: socket.user.id,
          receiverId,
          content,
          type,
          fileUrl,
        });
        
        const payload = {
          id: msg._id.toString(),
          senderId: socket.user.id,
          senderName: socket.user.name,
          senderAvatar: socket.user.avatar_url,
          receiverId,
          content,
          type,
          fileUrl,
          createdAt: msg.createdAt,
        };

        // Emit to both sender and receiver
        io.to(`user:${receiverId}`).emit('new_private_message', payload);
        socket.emit('new_private_message', payload);
        
        // Push notification (non-blocking)
        const notif = {
          type: 'private_message',
          title: `New message from ${socket.user.name}`,
          body: type === 'text' ? content.slice(0, 100) : `Sent you a ${type}`,
          data: { senderId: socket.user.id },
          action_url: `/chats?userId=${socket.user.id}`,
        };

        pool.query(
          `INSERT INTO notifications (user_id, type, title, body, data, action_url) 
           VALUES ($1::uuid, $2, $3, $4, $5, $6)`,
          [receiverId, notif.type, notif.title, notif.body, JSON.stringify(notif.data), notif.action_url]
        ).catch(err => logger.error('PM notification failed:', err.message, '| receiverId:', receiverId));

        pushNotification(receiverId, notif);
      } catch (err) {
        logger.error('send_private_message:', err);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    socket.on('fetch_private_history', async ({ targetId, limit = 50 }) => {
      try {
        const msgs = await PrivateMessage.find({
          $or: [
            { senderId: socket.user.id, receiverId: targetId },
            { senderId: targetId, receiverId: socket.user.id }
          ]
        }).sort({ createdAt: -1 }).limit(limit).lean();
        
        socket.emit('private_history', { 
          targetId, 
          messages: msgs.reverse().map(m => ({ ...m, id: m._id.toString() })) 
        });
      } catch (err) {
        logger.error('fetch_private_history:', err);
      }
    });

    socket.on('react_message', async ({ messageId, emoji }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        const existing = msg.reactions.find(r => r.userId === socket.user.id && r.emoji === emoji);
        if (existing) {
          msg.reactions = msg.reactions.filter(r => !(r.userId === socket.user.id && r.emoji === emoji));
        } else {
          msg.reactions.push({ emoji, userId: socket.user.id });
        }
        await msg.save();
        io.to(msg.roomId).emit('message_reacted', { messageId, reactions: msg.reactions });
      } catch {}
    });

    socket.on('typing', ({ subject, isTyping }) => {
      const roomId = `room:${subject.toLowerCase()}`;
      socket.to(roomId).emit('user_typing', {
        userId: socket.user.id, name: socket.user.name, isTyping,
        roomId,  // ← Fix: include roomId so frontend can filter by room
      });
    });

    // ── WebRTC Voice/Video Call Signaling ──
    // Relay offer to the specific target user
    socket.on('call_offer', ({ targetId, offer, callType = 'audio' }) => {
      io.to(`user:${targetId}`).emit('call_incoming', {
        callerId:   socket.user.id,
        callerName: socket.user.name,
        callerAvatar: socket.user.avatar_url,
        offer,
        callType,
      });
    });

    // Relay answer back to caller
    socket.on('call_answer', ({ callerId, answer }) => {
      io.to(`user:${callerId}`).emit('call_answered', {
        answererId: socket.user.id,
        answer,
      });
    });

    // Relay ICE candidates between peers
    socket.on('ice_candidate', ({ targetId, candidate }) => {
      io.to(`user:${targetId}`).emit('ice_candidate', {
        from:      socket.user.id,
        candidate,
      });
    });

    // Relay call end/decline
    socket.on('call_end', ({ targetId }) => {
      io.to(`user:${targetId}`).emit('call_ended', { by: socket.user.id });
    });

    socket.on('call_decline', ({ callerId }) => {
      io.to(`user:${callerId}`).emit('call_declined', { by: socket.user.id });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket: ${socket.user.name} disconnected`);
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user_left', { userId: socket.user.id, name: socket.user.name });
      }
    });
  });

  logger.info('✅ Socket.IO configured');
}

async function pushNotification(userId, notification) {
  if (ioInstance) ioInstance.to(`user:${userId}`).emit('notification', notification);
}

async function broadcastToRoom(subject, event, data) {
  if (ioInstance) ioInstance.to(`room:${subject.toLowerCase()}`).emit(event, data);
}

module.exports = { setupSocketIO, pushNotification, broadcastToRoom };
