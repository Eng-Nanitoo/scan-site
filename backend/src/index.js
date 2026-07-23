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
const superadminRoutes = require('./routes/superadmin');

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

function getRoom(subadminId) {
  return `subadmin:${subadminId}`;
}

function emitScannersStatus(subadminId) {
  const scanners = [];
  connectedScanners.forEach((data, socketId) => {
    if (data.subadminId === subadminId) {
      scanners.push({ socketId, ...data });
    }
  });
  io.to(getRoom(subadminId)).emit('scanners_status', scanners);
}

async function logActivity(subadminId, userId, username, action, guestName, details) {
  try {
    await pool.query(
      'INSERT INTO activity_log (user_id, username, action, guest_name, details, subadmin_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, username, action, guestName, details, subadminId]
    );
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

async function emitToSubadmin(subadminId, userId, username, action, guestName, details) {
  if (!subadminId) return;
  const activityData = {
    id: Date.now(),
    username,
    action,
    guest_name: guestName,
    details,
    created_at: new Date().toISOString()
  };
  io.to(getRoom(subadminId)).emit('activity', activityData);
  await logActivity(subadminId, userId, username, action, guestName, details);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/superadmin', superadminRoutes);

app.get('/api/scan/scanners-status', (req, res) => {
  const scanners = [];
  connectedScanners.forEach((data, socketId) => {
    scanners.push({ socketId, ...data });
  });
  res.json(scanners);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_subadmin', (data) => {
    if (data.subadminId) {
      socket.join(getRoom(data.subadminId));
      console.log(`Socket ${socket.id} joined room ${getRoom(data.subadminId)}`);
    }
  });

  socket.on('scanner_online', async (data) => {
    const subadminId = data.subadminId || null;
    connectedScanners.set(socket.id, {
      username: data.username,
      userId: data.userId,
      subadminId,
      connectedAt: new Date().toISOString()
    });
    console.log(`Scanner online: ${data.username} (subadmin: ${subadminId})`);

    if (subadminId) {
      socket.join(getRoom(subadminId));
    }

    emitScannersStatus(subadminId);
    await emitToSubadmin(
      subadminId,
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
      emitScannersStatus(scanner.subadminId);
      await emitToSubadmin(
        scanner.subadminId,
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
    const superadminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';

    const existing = await pool.query("SELECT id FROM users WHERE username = $1 AND role = 'superadmin'", [superadminUsername]);

    if (existing.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(superadminPassword, salt);

      await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'superadmin') ON CONFLICT (username) DO NOTHING",
        [superadminUsername, passwordHash]
      );
      console.log(`Default super admin created: ${superadminUsername}`);
    } else {
      console.log('Super admin already exists');
    }
  } catch (error) {
    console.error('Seed super admin error:', error);
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
