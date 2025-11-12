require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const chatSocket = require('./sockets/chatSocket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

chatSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
