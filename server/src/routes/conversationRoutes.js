const express = require('express');
const { getMessages, getConversationByUsers } = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/:conversationId/messages', protect, getMessages);
router.get('/user/:userId', protect, getConversationByUsers); 

module.exports = router;
