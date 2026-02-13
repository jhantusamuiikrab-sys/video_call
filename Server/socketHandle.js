
import { CallLog } from "./model/callLogs.js";

let onlineUsers = [];
const activeCalls = {};
export const socketHandle = (socket, io) => {
  socket.on("join", (user) => {
    if (!user?.id || !user?.username) return;

    onlineUsers = onlineUsers.filter((u) => u.userId !== user.id);

    onlineUsers.push({
      userId: user.id,
      name: user.username,
      socketId: socket.id,
    });

    socket.join(user.id);

    // 🔥 broadcast updated list
    io.emit("online:list", onlineUsers);
  });

  socket.on("disconnect", async () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);

    // 🔥 check active call
    const callData = activeCalls[socket.id];

    if (callData) {
      const endTime = new Date();
      const duration = parseFloat(
        ((endTime - callData.startTime) / (1000 * 60)).toFixed(2),
      );

      await CallLog.findByIdAndUpdate(callData.logId, {
        callEnd: endTime,
        totalTime: duration,
      });

      // cleanup both sockets pointing to same log
      for (const key in activeCalls) {
        if (activeCalls[key].logId.equals(callData.logId)) {
          delete activeCalls[key];
        }
      }
    }

    io.emit("online:list", onlineUsers);
  });

  // =========================
  // CALL REQUEST
  // =========================
  socket.on("call:request", (data) => {
    // console.log("📞 Call request received:", data);
    if (!data?.to) {
      console.log("❌ No target user id");
      return;
    }
    // console.log(`➡ Sending call to room/user: ${data.to}`);
    io.to(data.to).emit("call:incoming", data);
  });

  socket.on("call:accept", async (data) => {
    // io.to(data.to).emit("call:accepted", data);

    try {
      const newLog = await CallLog.create({
        callerId: data.to, // ID of the person who initiated the call
        receiverId: data.from, // ID of the person who accepted (the current user)
        callStart: new Date(),
        status: "completed",
      });

      // find both sockets
      const callerSocket = onlineUsers.find((u) => u.userId == data.from);
      const receiverSocket = onlineUsers.find((u) => u.userId == data.to);

      const callInfo = {
        logId: newLog._id,
        startTime: new Date(),
      };

      // store for BOTH sides
      if (callerSocket) {
        activeCalls[callerSocket.socketId] = callInfo;
      }

      if (receiverSocket) {
        activeCalls[receiverSocket.socketId] = callInfo;
      }

      io.to(data.to).emit("call:accepted", data);
    } catch (err) {
      console.error("Error creating call log:", err);
    }
  });

  // socket.on("call:reject", (data) => {
  //   io.to(data.to).emit("call:rejected", data);
  // });

  socket.on("call:reject", async (data, ack) => {
    await CallLog.create({
      callerId: data.to,
      receiverId: data.from,
      status: "rejected",
    });
    io.to(data.to).emit("call:rejected");
    ack && ack();
  });

  // WEBRTC part
  // offer
  socket.on("webrtc:offer", (data) => {
    io.to(data.to).emit("webrtc:offer", data);
  });

  // answer
  socket.on("webrtc:answer", (data) => {
    io.to(data.to).emit("webrtc:answer", data);
  });

  // ice candidate
  socket.on("webrtc:ice", (data) => {
    io.to(data.to).emit("webrtc:ice", data);
  });

  // for ending the call after receving
  // socket.on("call:end", (data) => {
  //   io.to(data.to).emit("call:ended", data);
  // });

  socket.on("call:end", async ({ to }) => {
    // io.to(to).emit("call:ended");

    const callData = activeCalls[socket.id];

    if (callData) {
      const endTime = new Date();
      const duration = parseFloat(
        ((endTime - callData.startTime) / (1000 * 60)).toFixed(2),
      );
      await CallLog.findByIdAndUpdate(callData.logId, {
        callEnd: endTime,
        totalTime: duration,
      });

      for (const key in activeCalls) {
        if (activeCalls[key].logId.equals(callData.logId)) {
          delete activeCalls[key];
        }
      }
    }

    io.to(to).emit("call:ended");
  });
};
