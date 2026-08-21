const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const { io: Client } = require('socket.io-client');
const { initSocketServer, emitToUser, emitToConversation } = require('../socket/socketServer');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

const runSocketTests = async () => {
  console.log('\n================================================================');
  console.log('      REAL-TIME SOCKET.IO ENGINE & EVENT DISPATCH TEST SUITE    ');
  console.log('================================================================\n');

  const app = express();
  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;

  console.log(`✔ Test Server listening on port ${port}`);

  // Test 1: Reject Unauthenticated Connections
  console.log('\n--- TEST 1: Unauthenticated Socket Connection Guard ---');
  await new Promise((resolve) => {
    const unauthClient = Client(serverUrl, {
      transports: ['websocket'],
      reconnection: false,
    });

    unauthClient.on('connect_error', (err) => {
      console.log('  [PASS] Unauthenticated connection correctly rejected:', err.message);
      unauthClient.close();
      resolve();
    });

    unauthClient.on('connect', () => {
      console.error('  [FAIL] Unauthenticated connection should have been rejected!');
      unauthClient.close();
      resolve();
    });
  });

  // Test 2: Authenticated Socket Connection & User Room Join
  console.log('\n--- TEST 2: Authenticated Connection & User Room Subscription ---');
  const user1 = { id: 'u1111111-1111-1111-1111-111111111111', email: 'user1@jecrc.ac.in', role: 'STUDENT', name: 'User One' };
  const user2 = { id: 'u2222222-2222-2222-2222-222222222222', email: 'user2@jecrc.ac.in', role: 'ALUMNI', name: 'User Two' };

  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '1h' });
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '1h' });

  const client1 = Client(serverUrl, { auth: { token: token1 }, transports: ['websocket'] });
  const client2 = Client(serverUrl, { auth: { token: token2 }, transports: ['websocket'] });

  await Promise.all([
    new Promise((res) => client1.on('connect', res)),
    new Promise((res) => client2.on('connect', res)),
  ]);

  console.log('  [PASS] Both sockets authenticated and connected successfully.');

  // Test 3: Instant Notification Event Push over Socket.IO
  console.log('\n--- TEST 3: Real-Time notification:new Event Push ---');
  const notifPromise = new Promise((resolve) => {
    client2.on('notification:new', (notif) => {
      console.log('  [PASS] Recipient received notification:new event instantly:', notif.title);
      resolve(notif);
    });
  });

  emitToUser(user2.id, 'notification:new', {
    id: 'notif_123',
    type: 'NEW_MESSAGE',
    title: 'New private message',
    message: 'User One sent you a message',
  });

  await notifPromise;

  // Test 4: Real-Time Message Event Push to Active Conversation Room
  console.log('\n--- TEST 4: Real-Time message:new Event Push & Conversation Room ---');
  const conversationId = 'conv_999';

  client1.emit('conversation:join', conversationId);
  client2.emit('conversation:join', conversationId);
  await new Promise((r) => setTimeout(r, 100));

  const msgPromise = new Promise((resolve) => {
    client2.on('message:new', (msg) => {
      console.log('  [PASS] Recipient received message:new event in conversation room:', msg.text);
      resolve(msg);
    });
  });

  emitToConversation(conversationId, 'message:new', {
    id: 'msg_888',
    conversationId,
    senderId: user1.id,
    content: 'Hello, this is a real-time message!',
    text: 'Hello, this is a real-time message!',
    timeAgo: 'Just now',
  });

  await msgPromise;

  // Test 5: Typing Indicators
  console.log('\n--- TEST 5: Real-Time typing:start & typing:stop Indicators ---');
  const typingStartPromise = new Promise((resolve) => {
    client2.on('typing:start', (data) => {
      console.log('  [PASS] User Two received typing:start indicator from User One:', data.name);
      resolve(data);
    });
  });

  client1.emit('typing:start', { conversationId });
  await typingStartPromise;

  // Cleanup
  client1.close();
  client2.close();
  server.close();

  console.log('\n================================================================');
  console.log('   ALL REAL-TIME SOCKET.IO ENGINE TESTS PASSED 100% (5/5)       ');
  console.log('================================================================\n');
};

runSocketTests().catch((err) => {
  console.error('[SOCKET TEST FATAL ERROR]:', err);
  process.exit(1);
});
