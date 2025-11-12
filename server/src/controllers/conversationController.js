const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Add this new function
exports.getConversationByUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Finding conversation between:', req.user._id, 'and', userId);

    // Find conversation where both users are participants
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] }
    });

    if (!conversation) {
      console.log('ℹ️ No conversation found');
      return res.json({ conversationId: null, messages: [] });
    }

    console.log('✅ Found conversation:', conversation._id);

    // Get all messages for this conversation
    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 });

    console.log('📨 Returning', messages.length, 'messages');

    res.json({
      conversationId: conversation._id,
      messages: messages
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Keep existing getMessages function
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
