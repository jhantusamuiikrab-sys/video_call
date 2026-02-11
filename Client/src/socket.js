import { io } from "socket.io-client";
let socket;
const getSocket = () => {
  if (!socket) {
    const endpoint =
      import.meta.env.VITE_BE_URL ||
      "https://video-call-server-hiq6.onrender.com"; //"http://localhost:5000";
    socket = io(endpoint);
  }
  return socket;
};
const setSocket = () => {
  socket = null;
};

export default { getSocket, setSocket };
