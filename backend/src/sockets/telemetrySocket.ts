import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: http.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Telemetry client registered: ${socket.id}`);

    // Join company room for multi-tenant isolation
    socket.on('join-company', (companyId: string) => {
      if (companyId) {
        const roomName = `company-${companyId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Telemetry client offline: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io telemetry controller not initialized!');
  }
  return io;
};

/**
 * Broadcast telemetry event to specific company room (or globally if no companyId provided)
 */
export const emitCompanyEvent = (event: string, companyId: string | undefined, data: any) => {
  if (!io) return;
  if (companyId) {
    io.to(`company-${companyId}`).emit(event, data);
  }
  // Also emit globally for backward compatibility / dev testing
  io.emit(event, data);
};

export const emitTelemetryUpdate = (data: any) => {
  emitCompanyEvent('telemetryUpdate', data?.companyId, data);
  emitCompanyEvent('location-update', data?.companyId, data);
};

export const emitPodUpdate = (data: any) => {
  emitCompanyEvent('podUpdate', data?.companyId || data?.pod?.companyId, data);
  emitCompanyEvent('pod-uploaded', data?.companyId || data?.pod?.companyId, data);
};

export const emitDriverOnline = (data: any) => {
  emitCompanyEvent('driver-online', data?.companyId, data);
};

export const emitDriverOffline = (data: any) => {
  emitCompanyEvent('driver-offline', data?.companyId, data);
};

