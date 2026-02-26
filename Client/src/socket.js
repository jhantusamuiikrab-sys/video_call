// import { io } from "socket.io-client";
// let socket;
// const getSocket = () => {
//   if (!socket) {
//     const endpoint = import.meta.env.VITE_BE_URL || "http://localhost:5000"; //  "https://video-call-server-hiq6.onrender.com"; //"http://localhost:5000";
//     socket = io(endpoint);
//   }
//   return socket;
// };
// const setSocket = () => {
//   socket = null;
// };

// export default { getSocket, setSocket };

import { io } from "socket.io-client";

let socket = null;

const getSocket = () => {
  if (!socket) {
    const endpoint ="https://video-call-server-kpp3.onrender.com" //"http://localhost:5000"; // "https://video-call-server-kpp3.onrender.com"// "http://localhost:5000"; //"https://video-call-server-kpp3.onrender.com" //"http://localhost:5000"  //"https://video-call-server-kpp3.onrender.com" //"http://localhost:5000" //"https://video-call-server-kpp3.onrender.com";

    socket = io(endpoint, {
      withCredentials: true, // send cookies for auth
      transports: ["websocket"], // avoid polling CORS problems
      autoConnect: false, // you control connect() in App.jsx
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  return socket;
};

const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

const resetSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket = null;
  }
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  resetSocket,
};
