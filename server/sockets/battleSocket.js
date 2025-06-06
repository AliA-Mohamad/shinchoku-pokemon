function setupBattleSockets(io) {
  const battleData = {};

  io.on("connection", (socket) => {
    socket.on("submit-build", ({ roomId, playerId, team }) => {
      if (!battleData[roomId]) {
        battleData[roomId] = { players: {} };
      }

      battleData[roomId].players[playerId] = { team };

      const playerIds = Object.keys(battleData[roomId].players);

      if (playerIds.length === 2) {
        const [p1, p2] = playerIds;
        const battleState = {
          [p1]: battleData[roomId].players[p1].team,
          [p2]: battleData[roomId].players[p2].team,
        };

        io.to(roomId).emit("start-battle", {
          roomId,
          myId: p1,
          battleState,
        });

        io.to(roomId).emit("start-battle", {
          roomId,
          myId: p2,
          battleState,
        });
      }
    });

    socket.on("battle-action", ({ roomId, action }) => {
      io.to(roomId).emit("battle-action", action);
    });
  });
}

module.exports = setupBattleSockets;
