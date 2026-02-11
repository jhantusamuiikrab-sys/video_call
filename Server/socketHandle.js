let onlineUsers = [];

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

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);

    // 🔥 broadcast updated list
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

  socket.on("call:accept", (data) => {
    io.to(data.to).emit("call:accepted", data);
  });

  // socket.on("call:reject", (data) => {
  //   io.to(data.to).emit("call:rejected", data);
  // });

  socket.on("call:reject", (data, ack) => {
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

  socket.on("call:end", ({ to }) => {
    io.to(to).emit("call:ended");
  });
};
