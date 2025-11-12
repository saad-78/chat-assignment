const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.username}`);

    await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    io.emit('user:online', { userId: socket.userId });

    const conversations = await Conversation.find({ participants: socket.userId });
    conversations.forEach(conv => {
      socket.join(conv._id.toString());
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, receiverId, content } = data;

        console.log('📨 Message received from:', socket.username);
        console.log('📨 Data:', data);

        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [socket.userId, receiverId] }
        });

        if (!conversation) {
          console.log('🆕 Creating new conversation');
          conversation = await Conversation.create({
            participants: [socket.userId, receiverId]
          });
          // Join both users to the room
          socket.join(conversation._id.toString());
          const receiverSockets = await io.in(receiverId).fetchSockets();
          receiverSockets.forEach(s => s.join(conversation._id.toString()));
        }

        // Save message
        const message = await Message.create({
          conversationId: conversation._id,
          senderId: socket.userId,
          content
        });

        await message.populate('senderId', 'username');

        console.log('✅ Message saved:', message._id);
        console.log('📤 Emitting to room:', conversation._id.toString());

        // Update conversation's last message
        conversation.lastMessage = message._id;
        await conversation.save();

        // Emit to conversation room
        io.to(conversation._id.toString()).emit('message:new', message);
      } catch (error) {
        console.error('❌ Message error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing:start', (data) => {
      socket.to(data.conversationId).emit('typing:start', {
        userId: socket.userId,
        username: socket.username
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.conversationId).emit('typing:stop', {
        userId: socket.userId
      });
    });

    socket.on('message:read', async (data) => {
      try {
        const { messageId, conversationId } = data;
        await Message.findByIdAndUpdate(messageId, { status: 'read' });
        socket.to(conversationId).emit('message:read', { messageId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', async (reason) => {
      console.log(`❌ User disconnected: ${socket.username} (${reason})`);
      try {
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });
        io.emit('user:offline', { userId: socket.userId });
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });

    socket.on('disconnecting', () => {
      console.log(`⚠️ User disconnecting: ${socket.username}`);
    });
  });
};
