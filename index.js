const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {origin : '*'}
});

const port = 3000;

// Object to store socket IDs with usernames
const users = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  // Listen for the 'setUsername' event to store the username
  socket.on('setUsername', (username) => {
    users[socket.id] = username;

    // Notify all clients of the updated user list
    io.emit('userList', users);
  });

  socket.on('message', (data) => {
    console.log(data);
    const { targetSocketId, message } = data;

    // Send message to specific client
    if (targetSocketId && users[targetSocketId]) {
      io.to(targetSocketId).emit('message', `${users[socket.id]}: ${message}`);
    } else {
      // If no targetSocketId is provided, broadcast to all clients
      io.emit('message', `${users[socket.id]}: ${message}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    // Remove the user's socket ID from the users object
    delete users[socket.id];

    // Notify all clients of the updated user list
    io.emit('userList', users);
  });
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));
