import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { socketHandle } from "./socketHandle.js";
import connectDB from "./config/db.js";
import router from "./routes/route.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", //"https://video-call-client-hat6.onrender.com" ,//"http://localhost:5173", //"https://video-call-client-hat6.onrender.com",
    credentials: true,
  }),
);

// 1. Connect to Database
connectDB();
app.use("/api/v1", router);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", //"https://video-call-client-hat6.onrender.com",//"http://localhost:5173", //"https://video-call-client-hat6.onrender.com",
    credentials: true,
  },
  pingTimeout: 25000,
});

io.on("connection", (socket) => {
  // console.log(`User connected: ${socket.id}`);
  socketHandle(socket, io);
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
