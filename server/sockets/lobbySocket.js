const { v4: uuidv4 } = require("uuid");

function setupLobbySockets(io) {
  const connectedPlayers = {};
  const rooms = {};

  io.on("connection", (socket) => {
    console.log("Novo jogador conectado:", socket.id);

    socket.on("register-player", (name) => {
      connectedPlayers[socket.id] = { id: socket.id, name };
      io.emit("players-update", Object.values(connectedPlayers));
      io.emit("rooms-update", Object.entries(rooms).map(([id, r]) => ({ roomId: id, ...r })));
    });

    socket.on("create-room", () => {
      if (!connectedPlayers[socket.id]) return;

      const alreadyHasRoom = Object.values(rooms).some((room) => room.ownerId === socket.id);
      if (alreadyHasRoom) {
        socket.emit("room-error", "Você já criou uma sala.");
        return;
      }

      const roomId = uuidv4().slice(0, 6).toUpperCase();
      rooms[roomId] = {
        ownerId: socket.id,
        ownerName: connectedPlayers[socket.id].name,
        players: [socket.id],
        status: "waiting",
      };

      socket.join(roomId);
      socket.emit("room-created", { roomId });
      io.emit("rooms-update", Object.entries(rooms).map(([id, r]) => ({ roomId: id, ...r })));
    });

    socket.on("join-room", ({ roomId, playerId }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error-message", "Sala não existe.");
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("error-message", "Sala cheia.");
        return;
      }

      room.players.push(playerId);
      socket.join(roomId);

      io.emit("rooms-update", Object.entries(rooms).map(([id, r]) => ({ roomId: id, ...r })));
    });

    socket.on("disconnect", () => {
      console.log("Jogador desconectado:", socket.id);
      delete connectedPlayers[socket.id];
      for (const roomId in rooms) {
        const room = rooms[roomId];
        room.players = room.players.filter((id) => id !== socket.id);
        if (room.players.length === 0) delete rooms[roomId];
      }

      io.emit("players-update", Object.values(connectedPlayers));
      io.emit("rooms-update", Object.entries(rooms).map(([id, r]) => ({ roomId: id, ...r })));
    });

    socket.on("get-room-info", (roomId) => {
      const room = rooms[roomId];
      if (room) {
        socket.emit("room-info", room);
      }
    });
  });
}

module.exports = setupLobbySockets;
