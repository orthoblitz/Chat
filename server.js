const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let users = {};
const messageFile = path.join(__dirname, 'messages.json');

// Load chat history
let messageHistory = [];
try {
  if (fs.existsSync(messageFile)) {
    messageHistory = JSON.parse(fs.readFileSync(messageFile, 'utf8'));
  }
} catch (err) {
  console.error('Failed to load message history:', err);
}

// Track cleared users (temporary memory)
let clearedChatUsers = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  // Only send history if not cleared
  if (!clearedChatUsers[socket.id]) {
    socket.emit('chat history', messageHistory);
  }

  socket.on('join', (username) => {
    users[socket.id] = username;
    io.emit('system message', `${username} joined the chat`);
    io.emit('user list', Object.values(users));
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const username = users[socket.id];
      delete users[socket.id];
      delete clearedChatUsers[socket.id]; // clean up
      io.emit('system message', `${username} left the chat`);
      io.emit('user list', Object.values(users));
    }
  });

  socket.on('chat message', (data) => {
    const { user, message } = data;
    const newMsg = { user, message };
    messageHistory.push(newMsg);

    try {
      // Ensure file exists before writing
      if (!fs.existsSync(messageFile)) {
        fs.writeFileSync(messageFile, '[]');
      }
      // Save instantly
      fs.writeFileSync(messageFile, JSON.stringify(messageHistory, null, 2));
    } catch (err) {
      console.error('Error saving message:', err);
    }

    io.emit('chat message', newMsg);
  });

  socket.on('typing', ({ user, typing }) => {
    socket.broadcast.emit('typing', { user, typing });
  });

  socket.on('clear chat', () => {
    clearedChatUsers[socket.id] = true;
  });
});

http.listen(PORT, () => {
  console.log('Server is running on port', PORT);
});
