let socket;

export function getSocket() {
  if (!socket) {
    socket = new WebSocket('ws://localhost:8080/ws');

    socket.onopen = () => {
      console.log('✅ Global WebSocket connected');
    };

    socket.onclose = () => {
      console.log('🔌 Global WebSocket disconnected');
    };

    socket.onerror = (err) => {
      console.error('🚨 WebSocket error:', err);
    };
  }

  return socket;
}
