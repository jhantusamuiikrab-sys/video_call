import { io } from "socket.io-client";
let socket;
const getSocket = () => {
  if (!socket) {
    const endpoint = import.meta.env.VITE_BE_URL || "http://localhost:5000";
    socket = io(endpoint);
  }
  return socket;
};
const setSocket = () => {
  socket = null;
};

export default { getSocket, setSocket };
