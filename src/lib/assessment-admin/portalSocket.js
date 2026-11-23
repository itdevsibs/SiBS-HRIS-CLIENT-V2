import { io } from 'socket.io-client';
import portalApi from './portalApi';

const raw = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const url = String(raw).trim().replace(/\/+$/, '').replace(/\/api$/, '');

// Dedicated socket connection. No employee/main-HRIS token is stored here.
const portalSocket = io(url, {
  withCredentials: true, transports: ['polling', 'websocket'], autoConnect: false,
  auth: async (callback) => {
    try {
      const response = await portalApi.get('/api/assessment-portal/socket-ticket');
      callback({ assessmentPortalTicket: response.data?.data?.ticket || '' });
    } catch { callback({ assessmentPortalTicket: '' }); }
  },
});
export default portalSocket;
