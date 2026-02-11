import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { socketHandle } from "./socketHandle.js";
import connectDB from "./config/db.js";
import router from "./routes/route.js";
// Adjust the path based on your filename

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// 1. Connect to Database
connectDB();
app.use("/api/v1", router);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 5000, // Recommended: increased from 1000
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // console.log(`User connected: ${socket.id}`);
  socketHandle(socket, io);
});

const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
