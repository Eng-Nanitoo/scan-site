require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const { pool, initDB } = require('./db');

const authRoutes = require('./routes/auth');
const cardsRoutes = require('./routes/cards');
const scanRoutes = require('./routes/scan');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

const connectedScanners = new Map();

function emitScannersStatus() {
  const scanners = [];
  connectedScanners.forEach((data, socketId) => {
    scanners.push({ socketId, ...data });
  });
  io.emit('scanners_status', scanners);
}

async function logActivity(userId, username, action, guestName, details) {
  try {
    await pool.query(
      'INSERT INTO activity_log (user_id, username, action, guest_name, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, action, guestName, details]
    );
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

async function emitActivity(userId, username, action, guestName, details) {
  const activityData = {
    id: Date.now(),
    username,
    action,
    guest_name: guestName,
    details,
    created_at: new Date().toISOString()
  };
  io.emit('activity', activityData);
  await logActivity(userId, username, action, guestName, details);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/scan', scanRoutes);

app.get('/api/scan/scanners-status', (req, res) => {
  const scanners = [];
  connectedScanners.forEach((data, socketId) => {
    scanners.push({ socketId, ...data });
  });
  res.json(scanners);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('scanner_online', async (data) => {
    connectedScanners.set(socket.id, {
      username: data.username,
      userId: data.userId,
      connectedAt: new Date().toISOString()
    });
    console.log(`Scanner online: ${data.username}`);
    emitScannersStatus();
    await emitActivity(
      data.userId,
      data.username,
      'scanner_online',
      null,
      `${data.username} connected as scanner`
    );
  });

  socket.on('disconnect', async () => {
    const scanner = connectedScanners.get(socket.id);
    if (scanner) {
      console.log(`Scanner offline: ${scanner.username}`);
      connectedScanners.delete(socket.id);
      emitScannersStatus();
      await emitActivity(
        scanner.userId,
        scanner.username,
        'scanner_offline',
        null,
        `${scanner.username} disconnected`
      );
    }
  });
});

async function seedAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await pool.query('SELECT id FROM users WHERE username = $1', [adminUsername]);

    if (existingAdmin.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [adminUsername, passwordHash, 'admin']
      );
      console.log(`Default admin user created: ${adminUsername}`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Seed admin error:', error);
  }
}

async function start() {
  await initDB();
  await seedAdmin();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
