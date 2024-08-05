const axios = require('axios');
const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: { origin: '*' }
});

const port = 3000;
const users = {};
const SECRET_KEY = '0x4AAAAAAAghj6h-vtw17GhlXceuDAN9kHM';

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('setUsername', async (data) => {
    const { username, captchaResponse } = data;

    // Validate captcha response
    const isValidCaptcha = await validateCaptcha(captchaResponse);
    if (!isValidCaptcha) {
      socket.emit('error', 'Invalid captcha');
      return;
    }

    users[socket.id] = username;
    io.emit('userList', users);
  });

  socket.on('message', (data) => {
    console.log(data);
    const { targetSocketId, message } = data;

    if (targetSocketId && users[targetSocketId]) {
      io.to(targetSocketId).emit('message', `${users[socket.id]}: ${message}`);
    } else {
      io.emit('message', `${users[socket.id]}: ${message}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    delete users[socket.id];
    io.emit('userList', users);
  });
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));

async function validateCaptcha(captchaResponse) {
  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: SECRET_KEY,
        response: captchaResponse
      })
    );
    return response.data.success;
  } catch (error) {
    console.error('Captcha validation failed:', error);
    return false;
  }
}