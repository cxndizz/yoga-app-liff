const { Server } = require('socket.io');
const eventBus = require('../events/eventBus');

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - Express HTTP server
 * @returns {Server} Socket.io server instance
 */
function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN_LIFF,
        process.env.CORS_ORIGIN_ADMIN,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Performance settings for 1000+ concurrent connections
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6, // 1MB
    transports: ['websocket', 'polling'],
  });

  // Connection tracking
  let connectionCount = 0;

  io.on('connection', (socket) => {
    connectionCount++;
    console.log(`[WebSocket] Client connected: ${socket.id} (Total: ${connectionCount})`);

    // Client metadata
    const clientInfo = {
      id: socket.id,
      connectedAt: new Date(),
      userAgent: socket.handshake.headers['user-agent'],
    };

    // Join room based on user role (if provided)
    socket.on('join', (data) => {
      const { userId, role, room } = data || {};

      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[WebSocket] User ${userId} joined personal room`);
      }

      if (role) {
        socket.join(`role:${role}`);
        console.log(`[WebSocket] Client joined role room: ${role}`);
      }

      if (room) {
        socket.join(room);
        console.log(`[WebSocket] Client joined room: ${room}`);
      }

      socket.emit('joined', { success: true, rooms: Array.from(socket.rooms) });
    });

    // Leave specific room
    socket.on('leave', (data) => {
      const { room } = data || {};
      if (room) {
        socket.leave(room);
        console.log(`[WebSocket] Client left room: ${room}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      connectionCount--;
      console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason}, Total: ${connectionCount})`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });
  });

  // ============================================
  // Event Bus Listeners - Broadcast to clients
  // ============================================

  // Payment events
  eventBus.on('payment', ({ type, data }) => {
    console.log(`[WebSocket] Broadcasting payment:${type}`, data?.id);

    // Broadcast to all admins
    io.to('role:super_admin').to('role:branch_admin').emit('payment:updated', data);

    // Broadcast to specific user
    if (data?.user_id) {
      io.to(`user:${data.user_id}`).emit('payment:updated', data);
    }

    // Trigger dashboard refresh for admins
    io.to('role:super_admin').to('role:branch_admin').emit('dashboard:refresh');
  });

  // Order events
  eventBus.on('order', ({ type, data }) => {
    console.log(`[WebSocket] Broadcasting order:${type}`, data?.id);

    // Broadcast to all admins
    io.to('role:super_admin').to('role:branch_admin').emit('order:updated', data);

    // Broadcast to specific user
    if (data?.user_id) {
      io.to(`user:${data.user_id}`).emit('order:updated', data);
    }

    // Trigger dashboard refresh for admins
    io.to('role:super_admin').to('role:branch_admin').emit('dashboard:refresh');
  });

  // Enrollment events
  eventBus.on('enrollment', ({ type, data }) => {
    console.log(`[WebSocket] Broadcasting enrollment:${type}`, data?.id);

    // Broadcast to all admins
    io.to('role:super_admin').to('role:branch_admin').emit('enrollment:updated', data);

    // Broadcast to specific user
    if (data?.user_id) {
      io.to(`user:${data.user_id}`).emit('enrollment:updated', data);
    }

    // Trigger dashboard refresh for admins
    io.to('role:super_admin').to('role:branch_admin').emit('dashboard:refresh');
  });

  // Course events
  eventBus.on('course', ({ type, data }) => {
    console.log(`[WebSocket] Broadcasting course:${type}`, data?.id);

    // Broadcast to all clients (admins and users)
    io.emit('course:updated', data);

    // Trigger dashboard refresh for admins
    if (type === 'created' || type === 'deleted') {
      io.to('role:super_admin').to('role:branch_admin').emit('dashboard:refresh');
    }
  });

  // Session events
  eventBus.on('session', ({ type, data }) => {
    console.log(`[WebSocket] Broadcasting session:${type}`, data?.id);

    // Broadcast to all clients
    io.emit('session:updated', data);

    // Trigger dashboard refresh for admins
    io.to('role:super_admin').to('role:branch_admin').emit('dashboard:refresh');
  });

  // Dashboard refresh event
  eventBus.on('dashboard:refresh', (data) => {
    console.log('[WebSocket] Broadcasting dashboard:refresh');
    io.to('role:super_admin').to('role:branch_admin').emit('dashboard:refresh', data);
  });

  // Health check endpoint for monitoring
  setInterval(() => {
    const socketCount = io.sockets.sockets.size;
    if (socketCount !== connectionCount) {
      console.warn(`[WebSocket] Connection count mismatch: tracked=${connectionCount}, actual=${socketCount}`);
      connectionCount = socketCount;
    }
  }, 60000); // Check every minute

  console.log('[WebSocket] Socket.io server initialized');

  return io;
}

module.exports = { initSocketServer };
